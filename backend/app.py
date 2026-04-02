import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from database import init_db, get_db, db
from models import MenuItem, Order
from sqlalchemy import func

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
init_db(app)
CORS(app)

# hello


# GET /api/menu - Return all menu items
@app.route('/api/menu', methods=['GET'])
def get_menu():
    with app.app_context():
        items = MenuItem.query.all()
        return jsonify([{
            'id': item.id,
            'name': item.name,
            'price': item.price,
            'portions': item.portions,
            'cutoff_time': item.cutoff_time.isoformat()
        } for item in items])


# POST /api/menu - Create menu item
@app.route('/api/menu', methods=['POST'])
def create_menu_item():
    try:
        data = request.get_json()
        cutoff = datetime.fromisoformat(data['cutoff_time'])
        item = MenuItem(
            name=data['name'],
            price=data['price'],
            portions=data.get('portions', 0),
            cutoff_time=cutoff
        )
        with app.app_context():
            db.session.add(item)
            db.session.commit()
            return jsonify({
                'id': item.id,
                'name': item.name,
                'price': item.price,
                'portions': item.portions,
                'cutoff_time': item.cutoff_time.isoformat()
            }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# GET /api/orders - Return all orders with item details
@app.route('/api/orders', methods=['GET'])
def get_orders():
    with app.app_context():
        orders = db.session.query(Order, MenuItem).join(MenuItem, Order.item_id == MenuItem.id).all()
        return jsonify([{
            'id': order.id,
            'name': order.name,
            'phone': order.phone,
            'item_id': order.item_id,
            'item_name': item.name,
            'quantity': order.quantity,
            'delivered': order.delivered,
            'timestamp': order.timestamp.isoformat()
        } for order, item in orders])


# POST /api/order - Create order with validation
@app.route('/api/order', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        with app.app_context():
            item = MenuItem.query.get(data['item_id'])
            if not item:
                return jsonify({'error': 'Menu item not found'}), 404
            
            # Check if current time > cutoff_time
            if datetime.now() > item.cutoff_time:
                return jsonify({'error': 'Order cutoff time passed'}), 400
            
            # Check if portions >= quantity
            if item.portions < data['quantity']:
                return jsonify({'error': f'Only {item.portions} portions available'}), 400
            
            # Create order
            order = Order(
                name=data['name'],
                phone=data['phone'],
                item_id=data['item_id'],
                quantity=data['quantity']
            )
            db.session.add(order)
            
            # Subtract quantity from portions
            item.portions -= data['quantity']
            db.session.commit()
            
            return jsonify({
                'id': order.id,
                'name': order.name,
                'phone': order.phone,
                'item_id': order.item_id,
                'quantity': order.quantity,
                'delivered': order.delivered,
                'timestamp': order.timestamp.isoformat()
            }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# PUT /api/order/<id>/deliver - Mark order as delivered
@app.route('/api/order/<int:order_id>/deliver', methods=['PUT'])
def deliver_order(order_id):
    try:
        with app.app_context():
            order = Order.query.get(order_id)
            if not order:
                return jsonify({'error': 'Order not found'}), 404
            
            order.delivered = True
            db.session.commit()
            
            return jsonify({
                'id': order.id,
                'name': order.name,
                'phone': order.phone,
                'item_id': order.item_id,
                'quantity': order.quantity,
                'delivered': order.delivered,
                'timestamp': order.timestamp.isoformat()
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# GET /api/prep - Prep list: group by item, sum quantities for undelivered orders
@app.route('/api/prep', methods=['GET'])
def get_prep_list():
    with app.app_context():
        prep_data = db.session.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(Order.quantity).label('total_quantity')
        ).join(Order, MenuItem.id == Order.item_id).filter(
            Order.delivered == False
        ).group_by(MenuItem.id, MenuItem.name).all()
        
        return jsonify([{
            'item_id': row[0],
            'item_name': row[1],
            'total_quantity': row[2]
        } for row in prep_data])


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)

with app.app_context():
    try:
        init_db()
    except Exception as e:
        print("DB init error:", e)

@app.route("/")
def home():
    return "Home Cook Orders Platform is running!"